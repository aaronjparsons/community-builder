<script>
    import Sprite from "$lib/components/base/Sprite.svelte";
    import { ASSETS } from "$lib/utils/assets";
    import { buildings } from "$lib/utils/interactables";

    const onBuildingClick = (event, building) => {
        console.log("Building clicked:", building);
    }
</script>

{#each buildings as building}
    <Sprite asset={building.asset} position={building.position} />
{/each}