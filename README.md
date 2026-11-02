# The universe, through a different lens

An interactive, Earth-centred model of the universe. Nine nested spheres turn around a still Earth — the Moon, Mercury, Venus, the Sun, Mars, Jupiter, Saturn, the sphere of the fixed stars, and al-Falak al-Muhit — and every planet, moon, asteroid, comet, star and galaxy sits where telescopes measure it.

**Live site:** see the repository's GitHub Pages link.

## What is in it

- **Real positions.** Planets, the Sun and the Moon from [Astronomy Engine](https://github.com/cosinekitty/astronomy) (accurate to about an arcminute against NASA JPL). Jupiter's four large moons from the same ephemeris.
- **Two geometries, one sky.** *Round spheres* keep perfect spheres and draw light on a curved map. *Flexing spheres* keep true distances and straight light; each sphere flexes just enough to hold its planet and the spheres never touch. Seen from Earth both are identical.
- **One logarithmic scale** from Earth's surface to the edge of the observable universe (46.3 billion light-years, Planck 2018 cosmology), with al-Muhit beyond it.
- **Stars** at their parallax distances (HYG database), the twelve zodiac figures after al-Sufi, **9,879 galaxies** at comoving distances from redshift (OpenNGC), clusters and nebulae by parallax.
- **Small bodies:** 359 real asteroids and dwarf planets and 118 comets and interstellar objects on their orbital elements, plus a statistical main belt and Jupiter's Trojans.
- **A physics article** comparing this model with the heliocentric one: gravity, light, and what physics can and cannot decide.
- An optional **Haqiqat layer** (the ten intellects and hudud after al-Kirmani), off by default and switched on in Settings.

## Running it locally

The page loads its data with `fetch`, so it must be served over HTTP rather than opened as a file:

```
python3 -m http.server 8000
```

then open <http://localhost:8000>.

## Layout

```
index.html            page markup
css/style.css         all styling
js/main.js            the model (three.js scene, astronomy, interface)
js/vendor/            three.js r170 and Astronomy Engine 2.1.19, served locally
data/universe.json    stars, constellation lines, galaxies, clusters, landmarks
data/minor.json       asteroid and comet orbital elements
textures/             Earth and Moon imagery
```

## Data and credits

- Planetary ephemeris: Astronomy Engine by Don Cross (MIT).
- 3D engine: three.js (MIT).
- Stars: HYG database v4.1 by David Nash / astronexus (CC BY-SA 4.0).
- Zodiac figures: Stellarium sky culture after al-Sufi.
- Galaxies, clusters, nebulae: OpenNGC by Mattia Verga (CC BY-SA 4.0).
- Asteroid and comet elements: Stellarium `ssystem_minor.ini`; 3I/ATLAS from the JPL Small-Body Database.
- Earth and Moon textures: three.js example textures, derived from NASA imagery.
