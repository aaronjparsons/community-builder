<script>
    import { onMount, getContext } from "svelte";
    import { AnimatedSprite, Texture } from "pixi.js";

    const { assets, ...restProps } = $props();

    const { app } = getContext("GAME");

    onMount(async () => {
        const textures = assets.map(asset => Texture.from(asset));
        const animatedSprite = new AnimatedSprite({
            textures,
            ...restProps
        });

        app.stage.addChild(animatedSprite);
        animatedSprite.play();
    })
</script>