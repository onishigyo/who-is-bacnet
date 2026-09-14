import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
// GitHub Pages のプロジェクトサイト（https://onishigyo.github.io/who-is-bacnet/）
// で配信するため、本番ビルドだけベースパスをリポジトリ名にする。
// dev / preview はルート配信のまま。
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/who-is-bacnet/' : '/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}))
