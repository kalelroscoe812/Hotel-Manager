import React, { useState } from 'react';
import { X, Building2 } from 'lucide-react';
import { HotelCreatePayload } from '../types';

interface CreateHotelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: HotelCreatePayload) => Promise<unknown>;
}

export const CreateHotelModal: React.FC<CreateHotelModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState<HotelCreatePayload>({
    name: '',
    address: '',
    city: '',
    state: '',
    country: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Hotel name is required (min 1 char)';
    else if (form.name.length > 150) errs.name = 'Max 150 characters';

    if (!form.address.trim()) errs.address = 'Address is required (min 1 char)';
    else if (form.address.length > 250) errs.address = 'Max 250 characters';

    if (!form.city.trim()) errs.city = 'City is required (min 1 char)';
    else if (form.city.length > 100) errs.city = 'Max 100 characters';

    if (!form.country.trim()) errs.country = 'Country is required (min 1 char)';
    else if (form.country.length > 100) errs.country = 'Max 100 characters';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setSubmitError('');
      setIsSubmitting(true);
      try {
        await onSubmit(form);
        setForm({ name: '', address: '', city: '', country: '' });
        onClose();
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'Could not create hotel');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      {/* Percentage-based Window Sizing: w-[92%] sm:w-[80%] md:w-[65%] lg:w-[48%] */}
      <div className="w-[92%] sm:w-[80%] md:w-[65%] lg:w-[48%] max-w-lg max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Register New Property</h2>
              <span className="text-[11px] text-slate-400">Enter hotel details and location information</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {submitError && (
            <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
              {submitError}
            </p>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Hotel Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Harbor House"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none transition ${
                errors.name ? 'border-rose-500' : 'border-slate-800 focus:border-amber-500'
              }`}
            />
            {errors.name && <p className="text-[11px] text-rose-400 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Street Address <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 1 Marina Way"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none transition ${
                errors.address ? 'border-rose-500' : 'border-slate-800 focus:border-amber-500'
              }`}
            />
            {errors.address && <p className="text-[11px] text-rose-400 mt-1">{errors.address}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                City <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Boston"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none transition ${
                  errors.city ? 'border-rose-500' : 'border-slate-800 focus:border-amber-500'
                }`}
              />
              {errors.city && <p className="text-[11px] text-rose-400 mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                State / Province
              </label>
              <input
                type="text"
                placeholder="e.g. MA"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Country <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. USA"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none transition ${
                  errors.country ? 'border-rose-500' : 'border-slate-800 focus:border-amber-500'
                }`}
              />
              {errors.country && <p className="text-[11px] text-rose-400 mt-1">{errors.country}</p>}
            </div>
          </div>

          {/* Button Spacing, Fixed Box Sizes, and CSS Flex Wrapping */}
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center min-w-[100px] h-10 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0 box-border border border-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center min-w-[140px] h-10 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 transition shadow-md shadow-amber-500/20 shrink-0 box-border"
            >
              {isSubmitting ? 'Registering...' : 'Register Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
