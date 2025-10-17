<script>
    import { onMount, setContext, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import { Application, Assets } from "pixi.js";

    import assets from '$lib/utils/assets';
    import { STATE } from '$lib/utils/constants';
    import { MapControls } from '$lib/utils/mapControls';

    // Game components
    import BaseMap from '$lib/components/sprites/BaseMap.svelte';
    import Test from '$lib/components/sprites/Test.svelte';

    let container;
    let mapControls;
    let context = {
        app: null,
        state: STATE.INIT,
        assets: {},
    }
    setContext('GAME', context)

    const preload = async () => {
        // Set default texture options for pixel art
        Assets.init({
            textureOptions: {
                scaleMode: 'nearest',
                mipmap: false,
                resolution: 1,
            }
        });
        await Assets.load(assets);
    }

    const init = async () => {
        if (!browser) return;

        try {
            context.app = new Application();
            await context.app.init({
                background: '#1099bb',
                resizeTo: window,
                antialias: false, // Disable antialiasing for crisp pixels
                resolution: 1, // Set resolution to 1 for pixel-perfect rendering
                hello: true, // Enable PixiJS console greeting
            });

            // Set default texture options for the application
            if (context.app.renderer?.texture) {
                context.app.renderer.texture.defaultOptions = {
                    scaleMode: 'nearest',
                    mipmap: false,
                    resolution: 1,
                };
            }

            // Disable interpolation for smoother pixel art
            context.app.stage.interactiveChildren = true;
            context.app.stage.sortableChildren = true;

            if (container) {
                container.appendChild(context.app.canvas);

                // Initialize map controls
                mapControls = new MapControls(context.app, (state) => {
                    context.state = state;
                });
                mapControls.initialize();

                context.state = STATE.PRELOAD;
                await preload();
                context.state = STATE.READY;
            }
        } catch (error) {
            console.error('Failed to initialize PixiJS:', error);
            context.state = STATE.ERROR;
        }
    };

    onMount(() => {
        init();
    });

    onDestroy(() => {
        if (mapControls) {
            mapControls.destroy();
        }
    });
</script>

<div class="w-full h-full" bind:this={container}>
    {#if !browser}
        <p class="absolute top-2 left-2">Loading...</p>
    {:else if context.state === STATE.INIT}
        <p class="absolute top-2 left-2">Initializing...</p>
    {:else if context.state === STATE.PRELOAD}
        <p class="absolute top-2 left-2">Loading assets...</p>
    {:else if context.state === STATE.ERROR}
        <p class="absolute top-2 left-2 text-red-500">Error initializing application</p>
    {:else if context.state === STATE.READY}
        <BaseMap />
        <Test />
    {/if}
</div>

<style>
    :global(canvas) {
        cursor: grab;
    }
</style>

