# Island Spec: The Sky Path of the Wild Hunt

> *"The sky grew black as pitch, and there came a sound like the roaring of a great tempest, yet no wind stirred the boughs beneath. Then across the racing clouds rode the Wild Huntsman with his pack of coal-black hounds whose eyes burned like coals of fire, and his horn sounded with a blast that stopped the beating of mortal hearts."*  
> — *European Folklore (The Legend of Herne the Hunter & The Asgardreia)*

---

## 1. Mythological Provenance

- **Traditions:** Pan-European Folklore (Germanic *Wilde Jagd*, Scandinavian *Åsgårdsreia*, British *Herne the Hunter & Gabriel's Hounds*, Celtic *Cŵn Annwn*).
- **Thematic Core:** The spectral cavalcade of ghostly riders, black hounds, and horned huntsmen sweeping across the winter night sky in pursuit of lost souls, fey harts, or doomed mortals; the dreadful horn blast that heralds their approach; and the dual outcome: **be hunted to exhaustion, or earn the spectral right to join the ride**.
- **Adaptation into an Island:** In *The World*, this island is a jagged crag of black slate and pine forests trapped in an eternal winter twilight. Its unique geographical feature is that **most of its gameplay takes place in the sky layer**: low-gravity cloud plateaus where the ghostly hunt rides continuously on galloping spectral horses.

---

## 2. Geography & Biomes

```
                   [ The Upper Cloud Layer: The Hunt's Skyway ]
                    The Ghost Highway of Galloping Hooves
                    The Horned Throne of the Grand Huntsman
                                 ▲
                                 │ Upward Storm Vortices & Cloud Strata
                                 ▼
                   [ The Frost-Bound Crag of the Gallows ]
                    Ancient Standing Stones & Cursed Oak of Herne
                    Frozen Peat Bogs of the Spectral Hounds
                                 ▲
                                 │ Rime-Covered Basalt Sea-Cliffs
                                 ▼
                   [ The Ghost Harbor: The Black Shore ]
                    Mooring of Ghost Galleys & Frozen Rigging
```

### Key Sub-Zones

1. **The Cloud Skyway of the Riders:** A dense layer of storm clouds that supports player footing. The Wild Hunt gallops along this atmospheric ribbon at high speed. Players can jump into the slipstream to catch up with the pack.
2. **The Cursed Oak of Herne:** An ancient blasted oak tree struck by black lightning where the antler-crowned huntsman first manifests when night falls.
3. **The Kennel of the Spectral Hounds (Cŵn Annwn):** A mist-choked valley of black slate rocks where the white-bodied, red-eared phantom hounds bay. Hearing their baying from afar indicates they are close; hearing it close indicates they are already right behind you.
4. **The Gallows Crag:** The highest sea cliff on the island where wind gusts howl like screaming voices. Sacrifices and offerings placed here determine whether the Hunt views you as prey or comrade.

---

## 3. Zonal Physics & Environmental Rules

- **The Hunt Mechanics (Prey vs. Hunter):**
  - *The Hunted:* When the horn of the Wild Hunt sounds, a designated player or group receives the *Mark of the Quarry*. Black hounds pursue them across the island. Surviving the hunt for 10 minutes without falling awards legendary ghost trophies and sovereign favor.
  - *Joining the Hunt:* Players who drink the *Draught of the Horned King* turn semi-incorporeal, mount spectral steeds, and gain the ability to gallop across the open sky alongside the NPC cavalry.
- **Incorporeal Cloud Striding:** Horses and players in spectral form do not fall through clouds, permitting continuous aerial cavalry combat high above the ocean.
- **Rime Gale Chill:** Moving against the direction of the Hunt inflicts rapid stamina drain; moving with the slipstream grants +100% movement speed.

---

## 4. Inhabitants & Factions

- **The Grand Huntsman (Odin / Herne / Gwyn ap Nudd):** A towering rider clad in moss-green and shadow, crowned with stag antlers, wielding a hunting spear that never misses and a horn carved from a dragon's rib.
- **The Spectral Cavalry:** Ghostly knights from across the ages (Norse berserkers, Celtic chieftains, medieval templars) who ride skeletal horses across the night sky.
- **The Gabriel Hounds (Cŵn Annwn):** Spectral hunting hounds with snow-white coats and glowing ruby-red ears and eyes, able to run upon air and water without slowing.
- **The White Hart:** A legendary ethereal stag that flees before the hunt. Capturing or saving the hart grants immense nature-aligned blessings.

---

## 5. Signature Relics & Local Loot

- **The Horn of the Wild Huntsman:** A wearable horn relic that can be blown once per day to summon a pack of three spectral hounds to pursue a designated target across any terrain.
- **Bridle of the Spectral Steed:** Allows the player to summon a ghost horse that can gallop across water surfaces and cloud layers for 3 minutes.
- **Antler Crown of Herne:** Grants night vision, stealth in wooded terrain, and prevents hostile predators from attacking first.

---

## 6. Implementation Notes for Three.js & Engine

- **Visual FX:** Volumetric rolling storm clouds with internal lightning flashes using Three.js custom particle billboards. Ghostly turquoise trails trailing behind the hooves of spectral steeds.
- **Lighting:** Moody midnight blue moonlight with cold silver rim lighting on character silhouettes.
- **Audio:** The distant baying of spectral hounds that plays with 3D spatial panning, the deep, echoing horn blast of the huntsman, galloping hooves on cloud banks, and screaming arctic winds.
