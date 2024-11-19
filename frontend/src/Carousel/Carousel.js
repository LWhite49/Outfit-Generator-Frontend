import Slider from "react-slick";
import { useContext } from "react";
import { FeedContext } from "../AppMain.js";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Carousel.css";
import _ from "lodash";

export const Carousel = ({ images }) => {
	// Source windowWidth
	const { windowWidth } = useContext(FeedContext);

	const settings = {
		dots: false,
		infinite: true,
		speed: 1500,
		slidesToShow: Math.max(Math.floor(windowWidth / 380), 2),
		slidesToScroll: 1,
		autoplay: true,
		autoplaySpeed: 3000,
		draggable: false,
	};

	// Shuffle images to display in random order
	images = _.shuffle(images);

	return (
		<div className="carousel">
			<Slider {...settings}>
				{images.map((image, index) => {
					return (
						<div key={index}>
							<img
								src={image}
								alt="Outfit"
								className="SlideImage"
								loading="lazy"
							/>
						</div>
					);
				})}
			</Slider>
		</div>
	);
};
