defmodule NapkinDispenser.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      NapkinDispenserWeb.Telemetry,
      {DNSCluster, query: Application.get_env(:napkin_dispenser, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: NapkinDispenser.PubSub},
      # Start the Finch HTTP client for sending emails
      {Finch, name: NapkinDispenser.Finch},
      # Start a worker by calling: NapkinDispenser.Worker.start_link(arg)
      # {NapkinDispenser.Worker, arg},
      # Start to serve requests, typically the last entry
      NapkinDispenserWeb.Endpoint,
      NapkinDispenserWeb.Presence
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: NapkinDispenser.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    NapkinDispenserWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
