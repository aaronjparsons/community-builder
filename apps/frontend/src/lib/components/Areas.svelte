<script>
    import { createDialog, melt } from '@melt-ui/svelte'
    import { fade, fly } from 'svelte/transition';
    import InteractableSprite from "$lib/components/base/InteractableSprite.svelte";
    import { ASSETS } from "$lib/utils/assets";
    import { areas } from "$lib/utils/interactables";

    const {
        elements: { trigger, portalled, overlay, content, title, description, close },
        states: { open },
    } = createDialog();
    let activeArea = $state(null);

    const onAreaClick = (event, area) => {
        console.log("Area clicked:", event, area);
        activeArea = area;
        $open = true;
    }
</script>

{#each areas as area}
    <InteractableSprite
        asset={area.asset}
        position={area.position}
        onClick={(event) => onAreaClick(event, area)}
    />
{/each}

{#if $open}
    <div use:melt={$portalled}>
        <div
            use:melt={$overlay}
            class="fixed inset-0 z-50 bg-black/50"
            transition:fade={{ duration: 150 }}
        ></div>
        <div
            use:melt={$content}
            class="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[90vw]
                max-w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white
                p-6 shadow-lg"
            transition:fly={{ y: 100, duration: 200 }}
        >
            <h2 use:melt={$title} class="m-0 text-lg font-medium text-black">
                {activeArea.title}
            </h2>
            <p use:melt={$description} class="mb-5 mt-2 leading-normal text-zinc-600">

            </p>
            <button use:melt={$close}> Close Dialog </button>
        </div>
    </div>
{/if}