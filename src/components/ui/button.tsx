import * as React from "react";
import { Slot } from "@radix-ui/react-slot@1.1.2";

import { cn } from "./utils";
import { buttonVariants, type ButtonVariants } from "./button-variants";

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  ButtonVariants & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button };
