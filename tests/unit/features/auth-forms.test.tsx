import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { UserMenu } from "@/components/layout/user-menu"
import { signInAction, signUpAction } from "@/features/auth/actions"
import { SignInForm } from "@/features/auth/components/sign-in-form"
import { SignUpForm } from "@/features/auth/components/sign-up-form"

vi.mock("@/features/auth/actions", () => ({
  signInAction: vi.fn(),
  signUpAction: vi.fn(),
}))

const searchParams = new URLSearchParams()
vi.mock("next/navigation", () => ({ useSearchParams: () => searchParams }))

describe("SignUpForm", () => {
  beforeEach(() => {
    vi.mocked(signUpAction).mockReset()
  })

  it("shows validation errors and does not call the server for invalid input", async () => {
    const user = userEvent.setup()
    render(<SignUpForm />)

    await user.type(screen.getByLabelText("Email"), "not-an-email")
    await user.type(screen.getByLabelText("Password"), "short")
    await user.click(screen.getByRole("button", { name: "Create account" }))

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument()
    expect(screen.getByText("Use at least 8 characters")).toBeInTheDocument()
    expect(screen.getByText("You must be 16 or older to create an account")).toBeInTheDocument()
    expect(signUpAction).not.toHaveBeenCalled()
  })

  it("submits valid input and shows the check-your-email confirmation", async () => {
    vi.mocked(signUpAction).mockResolvedValue({ ok: true })
    const user = userEvent.setup()
    render(<SignUpForm />)

    await user.type(screen.getByLabelText("Email"), "linh@example.com")
    await user.type(screen.getByLabelText("Password"), "correct horse battery")
    await user.click(screen.getByRole("checkbox", { name: "I am 16 years or older" }))
    await user.click(screen.getByRole("button", { name: "Create account" }))

    expect(await screen.findByRole("status")).toHaveTextContent("Check your email")
    expect(screen.getByRole("status")).toHaveTextContent("linh@example.com")
    expect(signUpAction).toHaveBeenCalledWith({
      displayName: "",
      email: "linh@example.com",
      password: "correct horse battery",
      ageConfirmed: true,
    })
  })

  it("shows a server error", async () => {
    vi.mocked(signUpAction).mockResolvedValue({ ok: false, error: "Too many attempts." })
    const user = userEvent.setup()
    render(<SignUpForm />)

    await user.type(screen.getByLabelText("Email"), "linh@example.com")
    await user.type(screen.getByLabelText("Password"), "correct horse battery")
    await user.click(screen.getByRole("checkbox", { name: "I am 16 years or older" }))
    await user.click(screen.getByRole("button", { name: "Create account" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Too many attempts.")
  })
})

describe("SignInForm", () => {
  beforeEach(() => {
    vi.mocked(signInAction).mockReset()
    for (const key of [...searchParams.keys()]) searchParams.delete(key)
  })

  it("passes the return path to the server action", async () => {
    searchParams.set("next", "/writing")
    vi.mocked(signInAction).mockResolvedValue({
      ok: false,
      error: "Email or password is incorrect.",
    })
    const user = userEvent.setup()
    render(<SignInForm />)

    await user.type(screen.getByLabelText("Email"), "linh@example.com")
    await user.type(screen.getByLabelText("Password"), "whatever")
    await user.click(screen.getByRole("button", { name: "Sign in" }))

    expect(signInAction).toHaveBeenCalledWith(
      { email: "linh@example.com", password: "whatever" },
      "/writing",
    )
    expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is incorrect.")
  })

  it("explains an invalid email link", () => {
    searchParams.set("error", "link_invalid")
    render(<SignInForm />)
    expect(screen.getByRole("alert")).toHaveTextContent("invalid or has expired")
  })
})

describe("UserMenu", () => {
  it("shows the user's initials, name and email, and a sign-out button", async () => {
    const user = userEvent.setup()
    render(<UserMenu name="Linh Tran" email="linh@example.com" signOutAction={vi.fn()} />)

    const trigger = screen.getByRole("button", { name: "Account menu" })
    expect(trigger).toHaveTextContent("LT")

    await user.click(trigger)
    expect(await screen.findByText("Linh Tran")).toBeInTheDocument()
    expect(screen.getByText("linh@example.com")).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "Sign out" })).toBeInTheDocument()
  })

  it("falls back to the email when there is no display name", () => {
    render(<UserMenu name={null} email="minh.nguyen@example.com" signOutAction={vi.fn()} />)
    expect(screen.getByRole("button", { name: "Account menu" })).toHaveTextContent("MN")
  })
})
