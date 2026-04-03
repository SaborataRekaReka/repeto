import Image from "@/components/Image";

import { contactsSocial } from "@/mocks/dashboard";

type ContactsProps = {};

const Contacts = ({}: ContactsProps) => (
    <>
        <div className="mb-3.5 text-h6">Contacts</div>
        <div className="card">
            {contactsSocial.map((contact) => (
                <div
                    className="flex items-center px-4 py-3.5 border-b border-n-1 last:border-none dark:border-white"
                    key={contact.id}
                >
                    <div className="relative shrink-0 w-6.5 h-6.5">
                        <Image
                            className="object-cover rounded-full"
                            src={contact.avatar}
                            fill
                            alt="Avatar"
                        />
                    </div>
                    <div className="w-[calc(100%-4.81rem)] mr-auto px-3">
                        <div className="truncate text-sm font-bold">
                            {contact.man}
                        </div>
                        <div className="truncate text-xs">{contact.email}</div>
                    </div>
                    <div className="flex justify-end items-center shrink-0 text-xs font-bold before:w-2 before:h-2 before:mr-1.5 before:rounded-full before:bg-purple-1">
                        {contact.status}
                    </div>
                </div>
            ))}
        </div>
    </>
);

export default Contacts;
