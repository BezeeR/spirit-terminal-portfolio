# StratBoard Portfolio Integration

StratBoard is project 06 in the Spirit Terminal project arena.

## Local check

```bash
npm install
npm run build
npm run dev
```

The source falls back to the StratBoard GitHub repository while no live deployment URL is configured.

## Connect the live deployment

After deploying StratBoard, add the production URL to the portfolio environment:

```env
VITE_STRATBOARD_URL=https://your-stratboard-deployment.example/
```

Rebuild and redeploy the portfolio. The project CTA and release label will then switch to the live StratBoard experience automatically.

## Included presentation assets

- Real StratBoard tactical editor preview at `public/assets/stratboard.webp`
- Dedicated project data in `src/data/projects.ts`
- StratBoard visual treatment in `src/components/ProjectVisual.tsx` and `src/styles.css`
