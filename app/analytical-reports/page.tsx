'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  DollarSign,
  Activity,
  LineChart,
  Target,
  Users,
  Calendar,
  ArrowRight,
  TrendingUp,
  PieChart
} from 'lucide-react';
import ProtectedRoute from '../protected-route';
import SidebarLayout from '../components/sidebar-layout';
import { useTranslations } from '../hooks/useTranslations';

export default function AnalyticalReportsPage() {
  const { t, translationsLoaded } = useTranslations();

  const reportCategories = [
    {
      id: 'financial',
      title: t('navigation.financialReports'),
      description: 'Revenue reports, outstanding payments, payment history, and financial statements',
      icon: DollarSign,
      href: '/analytical-reports/financial',
      color: 'bg-green-100 text-green-700',
      iconColor: 'text-green-600',
      roles: ['admin', 'staff']
    },
    {
      id: 'clinical',
      title: t('navigation.clinicalAnalytics'),
      description: 'Patient outcomes, treatment effectiveness, disease trends, and clinical metrics',
      icon: Activity,
      href: '/analytical-reports/clinical',
      color: 'bg-blue-100 text-blue-700',
      iconColor: 'text-blue-600',
      roles: ['admin', 'doctor', 'staff']
    },
    {
      id: 'operational',
      title: t('navigation.operationalAnalytics'),
      description: 'Appointment utilization, patient flow analysis, and resource utilization',
      icon: LineChart,
      href: '/analytical-reports/operational',
      color: 'bg-purple-100 text-purple-700',
      iconColor: 'text-purple-600',
      roles: ['admin', 'staff']
    },
    {
      id: 'performance',
      title: t('navigation.performanceReports'),
      description: 'Doctor performance metrics, staff productivity, and efficiency reports',
      icon: Target,
      href: '/analytical-reports/performance',
      color: 'bg-orange-100 text-orange-700',
      iconColor: 'text-orange-600',
      roles: ['admin', 'doctor']
    },
    {
      id: 'patient',
      title: t('navigation.patientAnalytics'),
      description: 'Patient demographics, visit patterns, and patient satisfaction metrics',
      icon: Users,
      href: '/analytical-reports/patient',
      color: 'bg-indigo-100 text-indigo-700',
      iconColor: 'text-indigo-600',
      roles: ['admin', 'doctor', 'staff']
    },
    {
      id: 'appointment',
      title: t('navigation.appointmentAnalytics'),
      description: 'Appointment trends, no-show rates, and scheduling efficiency',
      icon: Calendar,
      href: '/analytical-reports/appointment',
      color: 'bg-pink-100 text-pink-700',
      iconColor: 'text-pink-600',
      roles: ['admin', 'doctor', 'staff']
    }
  ];

  if (!translationsLoaded) {
    return (
      <ProtectedRoute>
        <SidebarLayout title="Analytical Reports" description="">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('common.loading')}</p>
          </div>
        </SidebarLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SidebarLayout
        title={t('navigation.analyticalReports')}
        description="Comprehensive analytical reports and insights for your hospital"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center space-x-3 mb-2">
              <BarChart3 className="h-8 w-8" />
              <h2 className="text-2xl font-bold">Analytical Reports Dashboard</h2>
            </div>
            <p className="text-blue-100">
              Access comprehensive analytics and insights to make data-driven decisions
            </p>
          </div>

          {/* Report Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportCategories.map((category) => (
              <Link
                key={category.id}
                href={category.href}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${category.color}`}>
                    <category.icon className={`h-6 w-6 ${category.iconColor}`} />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {category.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {category.description}
                </p>
              </Link>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">--</p>
                <p className="text-sm text-gray-600">Total Revenue</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">--</p>
                <p className="text-sm text-gray-600">Active Patients</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">--</p>
                <p className="text-sm text-gray-600">Appointments</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <PieChart className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">--</p>
                <p className="text-sm text-gray-600">Reports Generated</p>
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    </ProtectedRoute>
  );
}
