import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-10 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        <h1 className="text-3xl font-bold mb-2">Términos y Condiciones de Uso – Conektao</h1>
        <p className="text-sm text-gray-400 mb-10">Última actualización: 13 de febrero de 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Descripción del servicio</h2>
            <p>Conektao es una plataforma SaaS (Software como Servicio) que ofrece soluciones de gestión integral para restaurantes, incluyendo punto de venta, inventario, facturación y asistentes virtuales conversacionales como ALICIA, que operan a través de WhatsApp para automatizar la atención al cliente, toma de pedidos y análisis de negocio.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. Aceptación de los términos</h2>
            <p>Al acceder o utilizar los servicios de Conektao, el usuario acepta quedar vinculado por estos Términos y Condiciones. Si no está de acuerdo con alguna parte, debe abstenerse de utilizar el servicio.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Responsabilidades del cliente</h2>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>El cliente es responsable del uso correcto de la plataforma y de la veracidad de la información proporcionada (menú, precios, horarios).</li>
              <li>El cliente debe garantizar que cuenta con las autorizaciones necesarias para el tratamiento de datos de sus usuarios finales.</li>
              <li>El cliente no debe utilizar el servicio para fines ilícitos o que contravengan la legislación colombiana.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Actualizaciones del servicio</h2>
            <p>Conektao se reserva el derecho de actualizar, modificar o mejorar sus servicios sin previo aviso, siempre buscando mantener o incrementar la calidad del servicio ofrecido.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Limitación de responsabilidad</h2>
            <p>Conektao no será responsable por:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Interrupciones del servicio causadas por terceros (Meta, proveedores de internet, etc.).</li>
              <li>Pérdidas derivadas del uso incorrecto de la plataforma por parte del cliente.</li>
              <li>Errores en la información del menú o precios ingresados por el restaurante.</li>
              <li>Daños indirectos, incidentales o consecuentes derivados del uso del servicio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">6. Condiciones de pago</h2>
            <p>El servicio opera bajo un modelo de suscripción mensual. El pago debe realizarse dentro de los primeros 5 días de cada período de facturación. Los precios pueden ser actualizados con un aviso previo de 30 días.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Suspensión del servicio</h2>
            <p>Conektao se reserva el derecho de suspender el acceso al servicio en caso de:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Falta de pago por más de 15 días.</li>
              <li>Uso indebido o fraudulento de la plataforma.</li>
              <li>Violación de estos Términos y Condiciones.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">8. Propiedad intelectual</h2>
            <p>Todo el software, diseño, marcas y contenido de Conektao son propiedad exclusiva de Conektao. El cliente no adquiere ningún derecho de propiedad intelectual sobre la plataforma.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">9. Jurisdicción y ley aplicable</h2>
            <p>Estos Términos se rigen por las leyes de la República de Colombia. Cualquier controversia será resuelta ante los tribunales competentes de la ciudad de Bogotá, Colombia.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">10. Contacto</h2>
            <p>Para consultas sobre estos términos:</p>
            <p className="mt-2 font-medium">📧 soporte@conektao.com</p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Conektao. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
};

export default Terms;
