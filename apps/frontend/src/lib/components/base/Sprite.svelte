<script>
    import { onMount, getContext } from "svelte";
    import { Sprite } from "pixi.js";

    const {
        asset,
        position = { x: 0, y: 0 },
    } = $props();

    const { app } = getContext("GAME");

    onMount(async () => {
        const sprite = Sprite.from(asset);

        sprite.x = position.x;
        sprite.y = position.y;

        app.stage.addChild(sprite);
    })
</script>