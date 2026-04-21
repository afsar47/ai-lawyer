'use client';

import { useEffect, useRef } from 'react';

function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value));
}

export default function ScrollFrameCanvas({
	frameCount = 180,
	targetFps = 60,
	scrollContainerRef,
}: {
	frameCount?: number;
	targetFps?: number;
	scrollContainerRef?: { current: HTMLElement | null };
}) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	const rafRef = useRef<number | null>(null);
	const targetFrameRef = useRef(0);
	const currentFrameRef = useRef(0);
	const lastRenderTsRef = useRef(0);
	const fpsCounterRef = useRef({ lastTs: 0, frames: 0, fps: targetFps });

	useEffect(() => {
		const canvas = canvasRef.current;
		const container = containerRef.current;
		if (!canvas || !container) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const frameInterval = 1000 / targetFps;

		const resize = () => {
			const rect = container.getBoundingClientRect();
			const dpr = Math.max(1, window.devicePixelRatio || 1);

			canvas.width = Math.floor(rect.width * dpr);
			canvas.height = Math.floor(rect.height * dpr);
			canvas.style.width = `${rect.width}px`;
			canvas.style.height = `${rect.height}px`;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		};

		const updateTargetFrame = () => {
			const driver = scrollContainerRef?.current || container;
			const rect = driver.getBoundingClientRect();
			const vh = window.innerHeight || 1;
			const start = vh * 0.75;
			const end = -rect.height * 0.25;
			const progress = clamp((start - rect.top) / (start - end), 0, 1);
			targetFrameRef.current = progress * (frameCount - 1);
		};

		const draw = (frameFloat: number) => {
			const width = canvas.clientWidth;
			const height = canvas.clientHeight;
			const t = clamp(frameFloat / Math.max(frameCount - 1, 1), 0, 1);
			const cx = width / 2;
			const cy = height / 2;

			const bg = ctx.createLinearGradient(0, 0, width, height);
			bg.addColorStop(0, '#0f172a');
			bg.addColorStop(1, '#111827');
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, width, height);

			// Rotating accent ring.
			const ring = Math.min(width, height) * (0.18 + t * 0.1);
			ctx.save();
			ctx.translate(cx, cy);
			ctx.rotate(t * Math.PI * 2);
			ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(0, 0, ring, 0, Math.PI * 2);
			ctx.stroke();
			ctx.restore();

			// Abstract scale form changing frame-by-frame with scroll.
			const armLength = Math.min(width, height) * 0.28;
			const armAngle = (t - 0.5) * 0.8;

			ctx.save();
			ctx.translate(cx, cy);
			ctx.rotate(armAngle);
			ctx.fillStyle = '#fbbf24';
			ctx.fillRect(-2, -armLength * 0.85, 4, armLength * 1.35);
			ctx.fillRect(-armLength, -armLength * 0.35, armLength * 2, 5);

			ctx.strokeStyle = 'rgba(251, 191, 36, 0.95)';
			ctx.lineWidth = 1.8;
			ctx.beginPath();
			ctx.moveTo(-armLength * 0.72, -armLength * 0.35);
			ctx.lineTo(-armLength * 0.72, -armLength * 0.06);
			ctx.moveTo(armLength * 0.72, -armLength * 0.35);
			ctx.lineTo(armLength * 0.72, -armLength * 0.06);
			ctx.stroke();

			ctx.beginPath();
			ctx.arc(-armLength * 0.72, -armLength * 0.01, 18, 0, Math.PI, true);
			ctx.arc(armLength * 0.72, -armLength * 0.01, 18, 0, Math.PI, true);
			ctx.stroke();
			ctx.restore();

			// HUD text.
			ctx.fillStyle = 'rgba(15,23,42,0.78)';
			ctx.fillRect(12, height - 40, 250, 28);
			ctx.fillStyle = '#e5e7eb';
			ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace';
			ctx.fillText(
				`frame ${Math.round(frameFloat).toString().padStart(3, '0')} / ${frameCount}  |  ${fpsCounterRef.current.fps.toFixed(0)}fps`,
				20,
				height - 21
			);
		};

		const animate = (ts: number) => {
			if (lastRenderTsRef.current && ts - lastRenderTsRef.current < frameInterval) {
				rafRef.current = requestAnimationFrame(animate);
				return;
			}
			lastRenderTsRef.current = ts;

			const diff = targetFrameRef.current - currentFrameRef.current;
			currentFrameRef.current += diff * 0.16;

			const fpsState = fpsCounterRef.current;
			if (fpsState.lastTs === 0) fpsState.lastTs = ts;
			fpsState.frames += 1;
			if (ts - fpsState.lastTs >= 500) {
				fpsState.fps = (fpsState.frames * 1000) / (ts - fpsState.lastTs);
				fpsState.lastTs = ts;
				fpsState.frames = 0;
			}

			draw(currentFrameRef.current);
			rafRef.current = requestAnimationFrame(animate);
		};

		resize();
		updateTargetFrame();
		draw(0);
		rafRef.current = requestAnimationFrame(animate);

		window.addEventListener('resize', resize);
		window.addEventListener('scroll', updateTargetFrame, { passive: true });

		return () => {
			window.removeEventListener('resize', resize);
			window.removeEventListener('scroll', updateTargetFrame);
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [frameCount, targetFps, scrollContainerRef]);

	return (
		<div ref={containerRef} className="h-full w-full">
			<canvas ref={canvasRef} className="h-full w-full" />
		</div>
	);
}
