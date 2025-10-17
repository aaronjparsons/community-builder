<script>
    import { onMount, getContext } from "svelte";
    import { Sprite } from "pixi.js";

    const { asset } = $props();

    const { app } = getContext("GAME");

    onMount(async () => {
        const map = Sprite.from(asset);
        app.stage.addChild(map);
    })
</script>