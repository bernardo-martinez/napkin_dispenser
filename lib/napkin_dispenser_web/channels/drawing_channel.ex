defmodule NapkinDispenserWeb.DrawingChannel do
  use Phoenix.Channel, log_join: :info, log_handle_in: false
  alias NapkinDispenserWeb.Presence

  def join("drawing:" <> napkin_id, %{"isMaster" => true}, socket) do
    send(self(), :after_join)
    socket = socket |> assign(:napkin_id, napkin_id)
    {:ok, socket}
  end

  def join("drawing:" <> napkin_id, _msg, socket) do
    is_master = Presence.list(socket) == %{}
    send(self(), :after_join)
    socket = socket |> assign(:napkin_id, napkin_id)
    {:ok, %{is_master: is_master}, socket}
  end

  def handle_info(:after_join, socket) do
    {:ok, _} =
      Presence.track(socket, socket.assigns.napkin_id, %{
        online_at: inspect(System.system_time(:second))
      })

    push(socket, "presence_state", Presence.list(socket))
    {:noreply, socket}
  end

  def handle_in("draw", payload, socket) do
    broadcast!(socket, "draw", payload)
    {:noreply, socket}
  end

  def handle_in("clear", _payload, socket) do
    broadcast!(socket, "clear", %{})
    {:noreply, socket}
  end
end
