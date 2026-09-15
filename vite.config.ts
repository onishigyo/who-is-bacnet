import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
// GitHub Pages のプロジェクトサイト（https://onishigyo.github.io/who-is-bacnet/）
// で配信するため、ビルドのベースパスをリポジトリ名にする。preview はそのビルド
// 結果を配るので同じパスにそろえる（http://localhost:4173/who-is-bacnet/）。
// dev だけはルート配信のまま。
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/who-is-bacnet/' : '/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}))
