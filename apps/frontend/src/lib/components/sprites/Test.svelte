<script>
    import AnimatedSprite from "../AnimatedSprite.svelte";
    import { ASSETS } from "$lib/utils/constants";

    const assets = [
        'Charger_0',
        'Charger_1',
        'Charger_2',
        'Charger_3',
    ]
</script>

<AnimatedSprite {assets} animationSpeed={0.1} />