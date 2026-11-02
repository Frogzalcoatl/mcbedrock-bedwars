// biome-ignore-all lint/suspicious/noConsole: intended logging

import { createWriteStream, promises as promisesFs } from "node:fs";
import { resolve as _resolve, basename, join } from "node:path";
import { ZipArchive } from "archiver";

const MCADDON_FILENAME = "addon.mcaddon";
const OUTPUT_DIRECTORY_NAME = "_temp_mcpack_directory";

const PROJECT_ROOT = _resolve(import.meta.dirname, "..");
const SCRIPTS_DIRECTORY = join(PROJECT_ROOT, "scripts");
const OUTPUT_DIRECTORY = join(PROJECT_ROOT, OUTPUT_DIRECTORY_NAME);
const SCRIPTS_OUTPUT_DIRECTORY = join(OUTPUT_DIRECTORY, "scripts");
const SCRIPTS_FILE_PATH = join(SCRIPTS_DIRECTORY, "main.esm.js");
const FILE_PATHS = [
	join(PROJECT_ROOT, "LICENSE.md"),
	join(PROJECT_ROOT, "manifest.json"),
	join(PROJECT_ROOT, "pack_icon.png"),
];

async function copyFileToDirectory(filePath, destination) {
	await promisesFs.mkdir(destination, { recursive: true });
	const name = basename(filePath);
	const destinationPath = join(destination, name);
	await promisesFs.copyFile(filePath, destinationPath);
}

async function createZip(sourceDir, outputFilePath) {
	return new Promise((resolve, reject) => {
		const output = createWriteStream(outputFilePath);
		const archive = new ZipArchive({ zlib: { level: 9 } });

		output.on("close", resolve);
		archive.on("error", reject);

		archive.pipe(output);
		archive.directory(sourceDir, false);
		archive.finalize();
	});
}

async function build() {
	try {
		await promisesFs.rm(OUTPUT_DIRECTORY, { force: true, recursive: true }).catch(() => {});

		console.log(`Starting build in: ${PROJECT_ROOT}`);
		console.log("Cleaning up old output directory...");
		await promisesFs.rm(OUTPUT_DIRECTORY, { force: true, recursive: true });

		console.log(`Creating temporary directory at: ${OUTPUT_DIRECTORY}`);
		copyFileToDirectory(SCRIPTS_FILE_PATH, SCRIPTS_OUTPUT_DIRECTORY);
		for (const path of FILE_PATHS) {
			copyFileToDirectory(path, OUTPUT_DIRECTORY);
		}
		console.log("Successfully copied files.");

		const zipFilePath = join(PROJECT_ROOT, MCADDON_FILENAME);
		console.log(`Zipping contents to ${MCADDON_FILENAME}...`);
		await createZip(OUTPUT_DIRECTORY, zipFilePath);
		console.log("Successfully created addon.mcaddon.");

		console.log("Deleting temporary output directory...");
		await promisesFs.rm(OUTPUT_DIRECTORY, { force: true, recursive: true });
		console.log("Cleanup complete.");

		console.log("\nBuild finished successfully!");
	} catch (error) {
		console.error("\nAn error occurred during the build process:");
		console.error(error);
		process.exit(1);
	}
}

build();
