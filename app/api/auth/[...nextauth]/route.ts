import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '../../../../lib/mongodb-adapter';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import Patient from '../../../../models/Patient';
import bcrypt from 'bcryptjs';

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await dbConnect();
          
          // First check User model (admin, doctor, staff)
          let user = await User.findOne({ email: credentials.email });
          
          if (user) {
            // Check password for User accounts - password is required
            if (!user.password) {
              // Users without passwords cannot login
              return null;
            }
            
              const isValidPassword = await bcrypt.compare(credentials.password, user.password);
              if (isValidPassword) {
                return {
                  id: user._id.toString(),
                  email: user.email,
                  name: user.name,
                  role: user.role,
                  image: user.image,
                };
            }
            return null;
          }

          // If not found in User, check Patient model
          const patient = await Patient.findOne({ email: credentials.email });
          
          if (patient) {
            // Check password for Patient accounts - password is required
            if (!patient.password) {
              // Patients without passwords cannot login
              return null;
            }
            
              const isValidPassword = await bcrypt.compare(credentials.password, patient.password);
              if (isValidPassword) {
                return {
                  id: patient._id.toString(),
                  email: patient.email,
                  name: patient.name,
                  role: 'patient',
                  image: null,
                  patientId: patient.patientId,
                };
            }
            return null;
          }

          return null;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        if (user.patientId) {
          token.patientId = user.patientId;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        if (token.patientId) {
          session.user.patientId = token.patientId as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  // Do not use an insecure fallback secret.
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
