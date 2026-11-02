# mcbedrock-addon-starter
This addon template uses [sunshinekitsune's scripting template](https://github.com/sunshinekitsune/mcbedrock-gametest-starter) for Minecraft: Bedrock Edition, slightly modified to include a resource pack.

## Features
* Typescript configured for ES2023.
* Proper bundling with Esbuild for vanilla-data and third-party packages.
* Strict linting with Biome.
* Development environment configured with extensions.
* Minification and js.map.
* Automated mcaddon building.

## Requirements
You need the following utilities installed: [pnpm](https://pnpm.io/), [node LTS](https://nodejs.org/en/download), [vscode](https://code.visualstudio.com/)

## Setup
1. Clone the repository.

	Open a terminal and clone this repository.
	```sh
	git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
	cd YOUR_REPO
	```

2. Install dependencies.

	Install the required Node packages.
	```sh
	pnpm install
	```

3. Link this project to the com.mojang folder.

	Open `junctions.bat` and enter "y" to create junctions in the com.mojang folder.

4. Open your IDE.

	After creating junctions, open the folder in VSCode.
	* If you have already opened VSCode, restart so Biome can initialize properly.

5. Install the recommended extensions.

	In the bottom right of VSCode, it should ask you to install some extensions. Click yes!

6. Done! You are ready.

## Commands
- ``pnpm run watch`` Cleans the output directory and automatically recompiles scripts when files are modified. Use this while developing.
- ``pnpm run build`` Performs a single production build.
- ``pnpm run pack`` Builds code and packs all necessary files into a .mcaddon archive.
- ``pnpm run clean`` Removes temporary files.

# Post-setup instructions.
1. Open ``manifest.json`` in behaviors and resources then replace all 3 of the the UUIDs with new unique ones. [You can generate them quickly here](https://www.uuidgenerator.net/). Also update the pack names and descriptions.
2. Update the pack icons. (behaviors/pack_icon.png and resources/pack_icon.png)
3. If you want to compress your code for mcaddon builds, set minify: true in tools/esbuild.cjs.
4. Depending on who you are, update LICENSE.md as needed to match your needs.

## Beta API
This project is set up to use the stable version of gametest scripting modules. If you want to switch to beta, there is nothing stopping you. Just make sure to update both the version in package.json AND manifest.json
