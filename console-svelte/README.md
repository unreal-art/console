# Unreal Console (SvelteKit)

This is a SvelteKit (Svelte 5) implementation of the Unreal Console platform, migrated from the original React application. It uses modern web technologies to provide a performant and maintainable user interface.

## Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/) (Svelte 5)
- **UI Components**: [shadcn-svelte](https://shadcn-svelte.com/) 
- **Package Manager**: [Bun](https://bun.sh)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [lucide-svelte](https://lucide.dev/docs/lucide-svelte)
- **Testing**: [Playwright](https://playwright.dev/)
- **Deployment**: Netlify adapter

## Project Structure

```
console-svelte/
├── src/
│   ├── app.html           # Main HTML template
│   ├── lib/               # Shared utilities and components
│   │   ├── components/    # UI components
│   │   │   ├── custom/    # Custom application components
│   │   │   └── ui/        # shadcn UI components
│   │   └── utils/         # Utility functions
│   └── routes/            # SvelteKit routes and pages
├── static/                # Static assets (images, etc.)
├── tests/                 # Playwright tests
├── scripts/               # Build and utility scripts
└── utils/                 # Additional utilities
```

## Development

To install dependencies:

```bash
bun install
```

To run the development server:

```bash
bun run dev
```

To build for production:

```bash
bun run build
```

To add new shadcn-svelte components:

```bash
bun run shad:add <component-name>
```

## Migrated Components

The following custom components have been migrated from React to Svelte:
- AnimatedBackground
- CodePlayground
- FeatureCards
- TestimonialCarousel
- FAQ
- OnboardingFlow

## Testing

Run tests with:

```bash
bun run test
```

## Deployment

The application is configured for deployment on Netlify.
