import { useState } from "react";
import Field from "@/components/Field";
import Select from "@/components/Select";
import Counter from "@/components/Counter";
import Images from "./Images";
import Specifications from "./Specifications";

const images = [
    "/images/screenshot-4.jpg",
    "/images/screenshot-5.jpg",
    "/images/screenshot-6.jpg",
    "/images/screenshot-7.jpg",
    "/images/screenshot-8.jpg",
];

const categories = [
    {
        id: "0",
        title: "Laptops",
    },
    {
        id: "1",
        title: "Desktop",
    },
    {
        id: "2",
        title: "Mobile",
    },
];

const specifications = ["Digital", "UI / UX", "Web", "Theme"];

type GeneralInformationProps = {};

const GeneralInformation = ({}: GeneralInformationProps) => {
    const [title, setTitle] = useState<string>("");
    const [category, setCategory] = useState<any>(categories[0]);
    const [sku, setSku] = useState<string>("");
    const [warehouse, setWarehouse] = useState<number>(248);

    return (
        <div className="card">
            <div className="card-title">General information</div>
            <div className="p-5">
                <Images items={images} />
                <div className="flex mb-4 space-x-5 md:block md:space-x-0 md:space-y-4">
                    <Field
                        className="flex-1"
                        label="Product title"
                        placeholder="Enter title"
                        value={title}
                        onChange={(e: any) => setTitle(e.target.value)}
                        required
                    />
                    <Select
                        className="flex-1"
                        label="Category"
                        items={categories}
                        value={category}
                        onChange={setCategory}
                    />
                </div>
                <div className="flex mb-4 space-x-5 md:block md:space-x-0 md:space-y-4">
                    <Field
                        className="flex-1"
                        label="SKU"
                        placeholder="Enter SKU"
                        value={sku}
                        onChange={(e: any) => setSku(e.target.value)}
                        required
                    />
                    <Counter
                        className="flex-1"
                        label="Available"
                        title="Primary warehouse"
                        value={warehouse}
                        setValue={setWarehouse}
                    />
                </div>
                <Specifications items={specifications} />
                <div className="flex justify-between md:block md:mt-8">
                    <button className="btn-stroke min-w-[11.7rem] md:w-full md:mb-3">
                        Reset Changes
                    </button>
                    <button className="btn-purple min-w-[11.7rem] md:w-full">
                        Update Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GeneralInformation;
