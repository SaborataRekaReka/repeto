import AppField from "@/components/AppField";

const FormField = ({ label, children, full, className }: { label: string; children: React.ReactNode; full?: boolean; className?: string }) => (
    <AppField label={label} className={className} style={full ? { gridColumn: "1 / -1" } : undefined}>
        {children}
    </AppField>
);

export default FormField;
