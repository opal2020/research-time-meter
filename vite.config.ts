// ESM 형식으로 변환: vite.config.mjs로 저장 필요
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/research-time-meter/", // 레포 이름에 맞게 수정
  plugins: [react()],
  server: {
    open: true,
  },
});
