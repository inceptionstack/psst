import chalk from "chalk";
import { EXIT_USER_ERROR } from "../utils/exit-codes.js";
import { readSecretValue, readStdin } from "../utils/input.js";
import type { OutputOptions } from "../utils/output.js";
import { getUnlockedVault } from "./common.js";

interface SetOptions extends OutputOptions {
  stdin?: boolean;
  value?: string;
}

export async function set(
  name: string,
  options: SetOptions = {},
): Promise<void> {
  // Validate secret name
  if (!/^[A-Z][A-Z0-9_]*$/.test(name)) {
    if (options.json) {
      console.log(
        JSON.stringify({ success: false, error: "invalid_name", name }),
      );
    } else if (!options.quiet) {
      console.error(chalk.red("✗"), "Invalid name format");
      console.log(
        chalk.dim("  Must be uppercase with underscores (e.g., STRIPE_KEY)"),
      );
    }
    process.exit(EXIT_USER_ERROR);
  }

  let value: string;

  if (options.value) {
    value = options.value;
  } else if (options.stdin) {
    value = (await readStdin()).trim();
  } else {
    value = await readSecretValue(`Enter value for ${chalk.bold(name)}: `);
  }

  if (!value) {
    if (options.json) {
      console.log(
        JSON.stringify({ success: false, error: "empty_value", name }),
      );
    } else if (!options.quiet) {
      console.error(chalk.red("✗"), "Empty value not allowed");
    }
    process.exit(EXIT_USER_ERROR);
  }

  const vault = await getUnlockedVault(options);
  await vault.setSecret(name, value, options.tags);
  vault.close();

  if (options.json) {
    console.log(
      JSON.stringify({ success: true, name, tags: options.tags || [] }),
    );
  } else if (!options.quiet) {
    const tagMsg = options.tags?.length
      ? ` with tags: ${options.tags.join(", ")}`
      : "";
    console.log(chalk.green("✓"), `Secret ${chalk.bold(name)} saved${tagMsg}`);
  }
}
