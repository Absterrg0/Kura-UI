import { act } from "@testing-library/react";
import { expect, test } from "vitest";
import { render, screen, userEvent } from "../../test/utils";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "../components/popover";

test("probe", async () => {
  const calls: unknown[] = [];
  render(
    <Popover onOpenChange={(o) => calls.push(o)}>
      <PopoverTrigger>Open</PopoverTrigger>
      <PopoverContent aria-label="Panel">
        <PopoverClose>Close</PopoverClose>
      </PopoverContent>
    </Popover>,
  );
  console.log(document.body.innerHTML);
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  await act(() => new Promise((r) => setTimeout(r, 50)));
  console.log(document.body.innerHTML, calls);
  expect(1).toBe(1);
});
