# StratBoard Portfolio Integration

StratBoard is project 06 in the Spirit Terminal project arena.

## Local check

```bash
npm install
npm run build
npm run dev
```

The source falls back to the live StratBoard deployment even when no environment override is configured.

## Connect the live deployment

After deploying StratBoard, add the production URL to the portfolio environment:

```env
VITE_STRATBOARD_URL=https://stratboard-six.vercel.app/
```

Rebuild and redeploy the portfolio. The project CTA always opens the live StratBoard experience; the environment variable can override that URL later if the deployment changes.

## Included presentation assets

- Real StratBoard tactical editor preview at `public/assets/stratboard.webp`
- Dedicated project data in `src/data/projects.ts`
- StratBoard visual treatment in `src/components/ProjectVisual.tsx` and `src/styles.css`
