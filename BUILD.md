# Building HYBO

### Prerequisites
- Node.js 18+
- npm

### Build Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/ghostintheprompt/hybo.git
   cd hybo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Development mode**
   ```bash
   npm run dev
   ```

4. **Production build**
   ```bash
   npm run build
   ```

### First-Launch Instructions
- Open the app in your browser (defaults to `localhost:3000`).
- Press `P` to toggle Ghost Mode (Panic Key).
- Use `LOAD FILE` to inject your hypothetical media.

### Troubleshooting
- **Camera Access**: Ensure your browser permissions allow camera/microphone access for the site.
- **HMR Issues**: If using in a restricted environment, check `vite.config.ts` HMR settings.
