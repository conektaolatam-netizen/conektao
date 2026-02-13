import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const DataDeletion = () => {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-10 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        <h1 className="text-3xl font-bold mb-2">Solicitud de Eliminación de Datos</h1>
        <p className="text-sm text-gray-400 mb-10">Última actualización: 13 de febrero de 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed">
          <section>
            <p>En Conektao respetamos tu derecho a la privacidad y al control de tus datos personales, de conformidad con la Ley 1581 de 2012 de Colombia.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">¿Cómo solicitar la eliminación de tus datos?</h2>
            <p>Cualquier usuario puede solicitar la eliminación de sus datos personales almacenados en nuestros sistemas enviando un correo electrónico a:</p>
            <p className="mt-4 text-xl font-semibold text-center py-4 px-6 bg-gray-50 rounded-lg">📧 soporte@conektao.com</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">¿Qué debe incluir tu solicitud?</h2>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Nombre completo.</li>
              <li>Número de teléfono asociado al servicio.</li>
              <li>Descripción de los datos que desea eliminar.</li>
              <li>Motivo de la solicitud (opcional).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Plazo de respuesta</h2>
            <p>Conektao procesará tu solicitud en un plazo máximo de <strong>15 días hábiles</strong> a partir de la recepción del correo.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">¿Qué datos se eliminan?</h2>
            <p>Se eliminarán todos los datos personales almacenados en nuestros sistemas internos, incluyendo:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Información de contacto (nombre, teléfono).</li>
              <li>Historial de conversaciones con el asistente virtual.</li>
              <li>Datos de pedidos asociados a tu número.</li>
            </ul>
            <p className="mt-3 text-sm text-gray-500">Nota: Algunos datos pueden ser retenidos cuando exista una obligación legal o regulatoria que lo requiera.</p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Conektao. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
};

export default DataDeletion;
