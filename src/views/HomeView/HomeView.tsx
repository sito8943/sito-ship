import SceneCanvas from "../../components/SceneCanvas";
import ShipBuilderControls from "../../components/ShipBuilderControls";

const HomeView = () => {
  return (
    <section className="home-view">
      <SceneCanvas />
      <ShipBuilderControls />
    </section>
  );
};

export default HomeView;
