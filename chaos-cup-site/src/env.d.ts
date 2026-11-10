/// <reference types="@sanity/astro/module" />

declare namespace App {
  interface Locals {
    /** True when a Studio user turned on preview (drafts and click-to-edit). */
    preview: boolean;
  }
}
