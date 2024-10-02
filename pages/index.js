import { mongooseConnect } from "@/lib/mongoose";
import Hero from "./components/Hero";
import { Product } from "@/models/Product";
import Products from "./components/Products";
import Collection from "./components/Collection";

export default function Home({ featuredProduct, newProducts, collectionProduct1 }) {
  return (
    <main className="min-h-screen p-4 bg-background">
      {/* Load critical content first */}
      <Hero product={featuredProduct} />

      <hr className="my-1 h-px border-0 bg-gray-300" />

      {/* Lazy load less critical content */}
      <Products products={newProducts} />
      <hr className="my-1 h-px border-0 bg-gray-300" />
      <Collection product={collectionProduct1} />
    </main>
  );
}

export async function getServerSideProps() {
  await mongooseConnect();

  // Fetch only required data to optimize load time
  const featuredId = '66fc4fca878b68201c95a8ae';
  const collectionId = '66fc50d6878b68201c95a8bb';

  // Optimize database queries by reducing unnecessary data fetching
  const featuredProduct = await Product.findById(featuredId).lean();
  const collectionProduct1 = await Product.findById(collectionId).lean();

  // Limit newProducts to only what is necessary, use lean() for performance
  const newProducts = await Product.find({}, null, { sort: { '_id': 1 }, limit: 5 }).lean();

  return {
    props: {
      featuredProduct: JSON.parse(JSON.stringify(featuredProduct)),
      collectionProduct1: JSON.parse(JSON.stringify(collectionProduct1)),
      newProducts: JSON.parse(JSON.stringify(newProducts)),
    },
  };
}
