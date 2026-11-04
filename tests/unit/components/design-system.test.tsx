import { zodResolver } from "@hookform/resolvers/zod"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { BookA, Search } from "lucide-react"
import { useForm } from "react-hook-form"
import { describe, expect, it, vi } from "vitest"
import { z } from "zod"

import { EmptyState } from "@/components/feedback/empty-state"
import { ErrorState } from "@/components/feedback/error-state"
import { FormField } from "@/components/shared/form-field"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import { Input } from "@/components/ui/input"

import { renderWithProviders } from "../test-utils"

describe("Button", () => {
  it("exposes variant and size for styling and handles clicks", async () => {
    const onClick = vi.fn()
    render(
      <Button variant="outline" size="lg" onClick={onClick}>
        Save
      </Button>,
    )
    const button = screen.getByRole("button", { name: "Save" })

    expect(button).toHaveAttribute("data-variant", "outline")
    expect(button).toHaveAttribute("data-size", "lg")
    await userEvent.setup().click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("does not fire when disabled", async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    )
    await userEvent.setup().click(screen.getByRole("button", { name: "Save" }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it("renders as a link with asChild", () => {
    render(
      <Button asChild>
        <a href="/dashboard">Dashboard</a>
      </Button>,
    )
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard")
  })
})

describe("IconButton", () => {
  it("uses the label as its accessible name and hides the icon", () => {
    render(<IconButton icon={Search} label="Search" />)
    const button = screen.getByRole("button", { name: "Search" })
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })

  it("shows the label in a tooltip on focus when requested", async () => {
    renderWithProviders(<IconButton icon={Search} label="Search lessons" showTooltip />)
    await userEvent.setup().tab()
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Search lessons")
  })
})

describe("Badge", () => {
  it.each(["success", "warning", "info", "destructive"] as const)(
    "supports the %s variant",
    (variant) => {
      render(<Badge variant={variant}>Status</Badge>)
      expect(screen.getByText("Status")).toHaveAttribute("data-variant", variant)
    },
  )
})

describe("EmptyState and ErrorState", () => {
  it("renders title, description and action", () => {
    render(
      <EmptyState
        icon={BookA}
        title="No words yet"
        description="Saved words appear here."
        action={<Button>Add word</Button>}
      />,
    )
    expect(screen.getByText("No words yet")).toBeInTheDocument()
    expect(screen.getByText("Saved words appear here.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add word" })).toBeInTheDocument()
  })

  it("announces errors", () => {
    render(<ErrorState />)
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong")
  })
})

describe("FormField", () => {
  const schema = z.object({ email: z.email("Enter a valid email address") })

  function TestForm({ onSubmit }: { onSubmit: (values: z.infer<typeof schema>) => void }) {
    const form = useForm({ resolver: zodResolver(schema), defaultValues: { email: "" } })
    return (
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          label="Email"
          description="We never share your email."
          render={({ field, controlProps }) => <Input type="email" {...field} {...controlProps} />}
        />
        <Button type="submit">Submit</Button>
      </form>
    )
  }

  it("links the label and description to the input", () => {
    render(<TestForm onSubmit={vi.fn()} />)
    const input = screen.getByLabelText("Email")
    expect(input).toHaveAccessibleDescription("We never share your email.")
    expect(input).toHaveAttribute("aria-invalid", "false")
  })

  it("shows the Zod error and marks the input invalid", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<TestForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText("Email"), "not-an-email")
    await user.click(screen.getByRole("button", { name: "Submit" }))

    const input = screen.getByLabelText("Email")
    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument()
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(input).toHaveAccessibleDescription(/Enter a valid email address/)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("submits valid values", async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<TestForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText("Email"), "learner@example.com")
    await user.click(screen.getByRole("button", { name: "Submit" }))
    expect(onSubmit).toHaveBeenCalledWith({ email: "learner@example.com" }, expect.anything())
  })
})
