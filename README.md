# Psychic Laser

My first demo project using mediapipe. [View demo page on github pages](https://traumde.github.io/psychic-laser/)

## Effect Demo

![Psychic laser](./media/effect-demo.gif)

## Debug mode

![Debug mode](./media/debug-mode.gif)

## Info panel

In down of page there is info panel what display:

1. Effect is active or not
2. Debug mode on or off
3. Delegate have two modes "GPU" Or "CPU" (default: "GPU"; If you have some issues change delegate to CPU)
4. Additional info, shows loading text if model loads, shows error message if model loading failed and show tip if all okay

## Build & run

How to run and build project on your machine

Prerequisites:

- Node.js
- git
- pnpm

```Bash
# clone repo
git clone https://github.com/TraumDE/psychic-laser.git

# cd to dir
cd psychic-laser

# install deps
pnpm i

# launch dev server
pnpm dev

# build
pnpm build
```
