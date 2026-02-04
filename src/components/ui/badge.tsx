import * as React from "react";
import { Slot } from "@radix-ui/react-slot@1.1.2";

import { cn } from "./utils";
import { badgeVariants, type BadgeVariants } from "./badge-variants";

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  BadgeVariants & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge };
