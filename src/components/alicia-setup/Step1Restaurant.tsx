import React, { useState } from "react";
import { MapPin, Store } from "lucide-react";

interface Props {
  data: any;
  onSave: (data: Record<string, any>) => void;
  saving: boolean;
  onBack?: () => void;
}

const Step1Restaurant = ({ data, onSave, saving }: Props) => {
  const [name, setName] = useState(data.restaurant_name || "");
  const [address, setAddress] = useState(data.location_address || "");
  const [details, setDetails] = useState(data.location_details || "");
  const [description, setDescription] = useState(data.restaurant_description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      restaurant_name: name,
      location_address: address,
      location_details: details,
      restaurant_description: description,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">¿Cómo se llama tu negocio?</h2>
        <p className="text-muted-foreground mt-1">Así se presentará ALICIA con tus clientes</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-1.5">
          Nombre del restaurante *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: La Barra Crea Tu Pizza"
          className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-1.5">
          Descripción corta
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej: Pizzería artesanal con horno de leña en Ibagué"
          className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Ayuda a ALICIA a entender tu negocio
        </p>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-1.5">
          <MapPin className="w-4 h-4" /> Dirección
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Ej: Cra 5 #44-20, Ibagué"
          className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-1.5">
          ¿Cómo le describes la ubicación a un cliente?
        </label>
        <input
          type="text"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder='Ej: "Estamos en la Samaria, en la 44 con 5ta"'
          className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <p className="text-xs text-muted-foreground mt-1">
          ALICIA usará exactamente estas palabras
        </p>
      </div>

      <button
        type="submit"
        disabled={saving || !name.trim()}
        className="w-full py-3 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Siguiente →"}
      </button>
    </form>
  );
};

export default Step1Restaurant;
