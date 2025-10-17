<script>
    import AnimatedSprite from "$lib/components/base/AnimatedSprite.svelte";
    import { ASSETS } from "$lib/utils/assets";

    const assets = [
        'Charger_0',
        'Charger_1',
        'Charger_2',
        'Charger_3',
    ]
</script>

<AnimatedSprite {assets} animationSpeed={0.1} />