/** Running ffmpeg and ffprobe, both of which are expected on PATH. */
import { execFileSync } from 'node:child_process'
import { statSync } from 'node:fs'

export function ffmpeg(args: readonly string[]): void {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })
}

export interface Probe {
  readonly width: number
  readonly height: number
  readonly fps: number
  readonly seconds: number
  readonly bytes: number
}

export function probe(file: string): Probe {
  const out = execFileSync('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,avg_frame_rate,nb_frames:format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=0', file,
  ], { encoding: 'utf8' })
  const field = (name: string): string => {
    const line = out.split(/\r?\n/).find((l) => l.startsWith(`${name}=`))
    return line === undefined ? '' : line.slice(name.length + 1)
  }
  const ratio = field('avg_frame_rate').split('/')
  const num = Number(ratio[0] ?? 0)
  const den = Number(ratio[1] ?? 1)
  const duration = Number(field('duration'))
  const nbFrames = Number(field('nb_frames'))
  const fps = den === 0 ? 0 : num / den
  const seconds = Number.isFinite(duration) && duration > 0
    ? duration
    : (fps > 0 && Number.isFinite(nbFrames) ? nbFrames / fps : 0)
  return {
    width: Number(field('width')),
    height: Number(field('height')),
    fps: Math.round(fps * 100) / 100,
    seconds: Math.round(seconds * 100) / 100,
    bytes: statSync(file).size,
  }
}

export function report(label: string, file: string): void {
  const p = probe(file)
  const mb = (p.bytes / (1024 * 1024)).toFixed(2)
  console.log(`${label}  ${p.width}x${p.height}  ${p.fps}fps  ${p.seconds}s  ${mb} MB  ${file}`)
}
