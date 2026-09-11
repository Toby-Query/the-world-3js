# The World *(working title)*

> One world. Every myth. Everyone in it.

**The World** is a concept for a massively multiplayer online game (MMO) set in a single shared world where every mythology, every era, and every kind of strangeness exist side by side. Futuristic cities with news always playing on the buildings sit across the water from islands ruled by gods, haunted towns nobody can leave, and seas with ancient challenges waiting at the bottom.

The world is an endless ocean dotted with islands. Each island has its own feel, its own rules, and its own secrets. New islands can be added at any time, so the world keeps growing.

---

## Table of Contents

- [Vision](#vision)
- [The Big Technical Goal: 8 Billion Players, One World](#the-big-technical-goal-8-billion-players-one-world)
- [The World Structure](#the-world-structure)
- [Realms & Islands](#realms--islands)
- [Lore & Mystery](#lore--mystery)
- [Gameplay Systems](#gameplay-systems)
- [Economy](#economy)
- [Art Direction](#art-direction)
- [Launch Strategy: Museum First](#launch-strategy-museum-first)
- [Inspirations & References](#inspirations--references)
- [Open Questions](#open-questions)

---

## Vision

- **One place for everyone.** Everyone plays in the same world, not in separate servers or copies.
- **Every mythology.** Greek, Norse, Chinese, and more, all real and all present, with room for every culture's legends.
- **Many worlds in one.** Tech, mystical, divine, horror-mystery. Each area has its own tone, and some have their own physics.
- **Expandable by design.** An infinite ocean means new islands, stories, and mythologies can be added without changing what's already there.
- **Story-driven.** There's a central mystery about what this world is and why it exists.

---

## The Big Technical Goal: 8 Billion Players, One World

The goal is to support **up to 8 billion characters in the same world**, which means everyone on Earth. No MMO has done anything close to this, so it's the core technical problem the project has to solve.

A single server can't hold 8 billion players in the literal sense. The goal is to make it *feel* that way: one continuous world with no separate servers to choose from. Approaches to research:

| Approach | Idea |
|---|---|
| **Spatial partitioning** | Split the world into regions, each simulated by different machines. Hand players off smoothly as they move between regions. |
| **Interest management** | Each player only gets updates about what's near them or relevant to them. Nobody needs to know about all 8 billion others. |
| **Islands as natural boundaries** | The ocean-and-islands layout creates natural seams for splitting the world across servers, with sea travel covering the handoffs. |
| **Dynamic density handling** | When a spot gets crowded, shift how it's handled on the fly: add more servers, reduce detail on distant players, or use soft layering. |
| **Persistent world state** | Keep the shared world (events, economy, changes to the world) in one global state, even while the moment-to-moment simulation is spread out. |
| **Client-side prediction** | Let the player's own machine do as much work as possible so the servers only handle what must be authoritative. |

**Reference points:** EVE Online (single-shard universe), SpatialOS-style distributed simulation, and large-scale Minecraft projects that mapped the entire Earth (see [Inspirations](#inspirations--references)).

---

## The World Structure

- **An infinite ocean.** The world is endless water. Islands sit in it, and new ones can be placed anywhere, whenever we want.
- **Islands as themed zones.** Like *One Piece*, each island is its own place with its own culture, rules, story, and danger.
- **Different physics per zone.** Some islands, and space itself, work by different rules: low gravity, altered time, magic-driven physics, and so on.
- **Vertical layers:**
  - **The surface:** islands, cities, open sea
  - **The deep:** underwater kingdoms and trials at the bottom of the ocean
  - **The underworld:** the realm of the dead beneath everything
  - **The sky & space:** above the world, with its own physics

---

## Realms & Islands

These are starting concepts. The world is built to hold many more.

### 🌆 The Tech World
Futuristic megacities where screens cover the buildings and **news is always airing**. The broadcasts could report real events happening elsewhere in the world, like a god's war, a plague outbreak, or a player's achievement, which ties the whole world together.

### ✨ The Mystical World
Enchanted lands, magic healing sites, shape-shifters, and ancient forces.

### ⚡ Realms of the Gods
Every pantheon lives here. Early ideas:
- **Norse:** Thor fighting Jörmungandr, the World Serpent, as an ongoing world event you can see or join.
- **Greek:** Hermes' winged shoes and Poseidon's trident as legendary items. The trident controls the oceans, and even the water in human blood.
- **Chinese:** The Monkey King, Sun Wukong. There are challenges at the bottom of the sea, a nod to the Dragon King's underwater palace where Wukong found his staff.

### 🌫️ The Mystery Town
A town inspired by the TV show *From*. Once you're in, leaving isn't simple. Strange rules, creatures that come out at night, and secrets that feed into the main lore.

### 💀 The Underworld
The land of the dead, below everything. It could connect to death and respawn mechanics and to the underworld myths of many cultures (Hades, Hel, Diyu, Duat...).

### 🐎 The Wild Hunt
Based on the European folklore of a ghostly group of riders crossing the sky.
- Could be a **winter-only** island or a seasonal event.
- Players may get the chance to **join the Hunt**: turn invisible and ride a spectral horse across the sky.
- Or the Hunt **hunts you**, tormenting you until you complete a certain goal.

### 🌌 Space
Beyond the sky, with different physics rules.

---

## Lore & Mystery

The world needs a central mystery to hold everything together:

- *Why* do all these mythologies exist in the same place?
- *Who* or *what* made this endless ocean?
- *Why* does it keep growing, with new islands appearing?
- *What* is the Tech World broadcasting, and who controls the news?

The story should be revealed gradually through exploration, events, and hidden clues across the islands, so that every realm holds a piece of it.

---

## Gameplay Systems

### Character Customization
Deep, expressive character creation and ongoing customization of appearance, style, and identity.

### Powers
- **Mutant-style powers:** innate abilities unique to characters *(to be explored)*
- **Shape-shifting:** take on other forms
- **Mythic items:** Hermes' shoes (speed and flight), Poseidon's trident (water and blood control), and other legendary relics

### Plagues & Healing
A world-level disease system:
- Some **diseases can only be caught in one place**.
- Some can **only be cured in one specific place**, such as a magic healing spring or a sacred site.
- This makes players travel, creates demand for guides and escorts, and lets outbreaks spread through the world as live events.

### World Events
Large ongoing events like Thor vs. the World Serpent, the Wild Hunt riding out, and plague outbreaks. The news screens in the Tech World report on them as they happen.

---

## Economy

- **A self-running online store.** The marketplace runs on its own, driven by players, without the game needing to manage it.
- **Sell what you can't use.** Items you can't equip can still be sold to other players.
- **Random treasure.** Money and loot can be found anywhere in the world, which rewards exploring.

---

## Art Direction

- **Style:** Stylized PBR (physically based rendering). Realistic lighting and materials, with bold, painterly, stylized shapes and colors.
- **Main reference:** *Immortals Fenyx Rising*: bright, mythic, readable, and full of color.
- **Tone per realm:** The shared style should shift in mood per zone. Neon and screen glow in the Tech World, soft magical light in the Mystical World, eerie muted tones in the Mystery Town, cold spectral blues for the Wild Hunt.

---

## Launch Strategy: Museum First

Before it becomes a full game, **The World could launch as a museum**: an explorable space showing off the mythologies, creatures, relics, and islands.

Benefits:
- Build and test the art style, world, and tech at a smaller scale
- Grow an audience early
- Every exhibit can later become a playable island

---

## Inspirations & References

- **Immortals Fenyx Rising:** art style and mythological tone
- **One Piece:** island-by-island world structure with distinct themes
- ***From* (TV series):** the inescapable mystery town
- **Minecraft world map projects:** proof that the entire Earth can be mapped inside a game world
- **River Drift:** [Steam page](https://store.steampowered.com/app/4382680/River_Drift/)
- **Mythology:** Greek, Norse, Chinese, European folklore, and more to come

---

## Open Questions

- [ ] What is the central lore? What *is* this world?
- [ ] How do players travel between islands? Ships, portals, flight?
- [ ] What's the core gameplay loop minute to minute?
- [ ] How exactly do mutant powers work, and how do they fit with mythic powers?
- [ ] Is the Wild Hunt a reward, a punishment, or both?
- [ ] Which tech stack and architecture can realistically move toward the 8-billion-player goal?
- [ ] What goes in the museum version, and what's the first playable island?
- [ ] *"Be..."*: an unfinished idea from the brainstorm. Still to be filled in.

---

*This is a living design document. Islands, myths, and ideas will keep being added, just like the world itself.*
