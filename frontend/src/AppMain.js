import "./AppMain.css";
import { Home } from "./Home/Home";
import { Generator } from "./Generator/Generator";
import { About } from "./About/About";
import { useState, createContext, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import axios from "axios";
import logo from "./images/WWLogo.png";
import circle from "./images/circle.svg";
import loadingBuddy from "./images/LoadingBuddy.png";

//Import Images using require.context
const imageContext = require.context(
	"./images/CarouselImages",
	false,
	/\.(png|jpe?g|svg)$/
);
const imageContextKeys = imageContext.keys();
const images = imageContextKeys.map((key) => imageContext(key));

// Create a context for the outfitFeed array to avoid prop drilling
export const FeedContext = createContext();

export const AppMain = () => {
	// Loading state, initially false
	const [initLoad, setInitLoad] = useState(false);

	// Create a useEffect that sets the loading state to true after 2 seconds
	useEffect(() => {
		setTimeout(() => {
			setInitLoad(true);
		}, 3000);
	});
	// Create a state for the outfitFeed array as well as a bool telling if the feed is randomly generated
	const [outfitFeed, setOutfitFeed] = useState({
		pallet: [],
		outfits: [],
		wasRandom: false,
	});

	// Reference origin to conditionally assign requests to the server
	const origin = window.location.origin;
	let backendTarget = "";
	if (origin.includes("localhost")) {
		backendTarget = "http://localhost:10000";
	} else {
		backendTarget =
			"https://wardrobewizard-671656535746.us-central1.run.app";
	}

	// Create state for feed status, used for conditional rendering and feed expansion
	const [feedStatus, setFeedStatus] = useState({
		feedLength: 20,
		currIndex: 0,
		expanded: false,
	});

	// Create a state for size, brand, and genders
	const [size, setSize] = useState({
		topSizes: [],
		bottomSizes: [],
		shoeSizes: [],
	});
	const [brand, setBrand] = useState([]);
	const [topGender, setTopGender] = useState("male");
	const [bottomGender, setBottomGender] = useState("male");
	const [shoeGender, setShoeGender] = useState("male");

	// Create a state for current subpage used for conditional rendering of navbar
	const [subPage, setSubPage] = useState(() => {
		if (
			localStorage.getItem("subPage") &&
			Date.now() - localStorage.getItem("lastLoad") < 5000
		) {
			return localStorage.getItem("subPage");
		}
		return "/home";
	});

	// Create a useEffect that stores the subpage in local storage when it changes, and updates lastLoad on page closing
	useEffect(() => {
		localStorage.setItem("subPage", subPage);
		localStorage.setItem("lastLoad", Date.now());
	}, [subPage]);

	// Create a state for the current width of the window
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);

	// Create a listener for window width changes, and add an unload event listener to update lastLoad
	useEffect(() => {
		const handleResize = () => {
			setWindowWidth(window.innerWidth);
		};

		const handleUnload = () => {
			localStorage.setItem("lastLoad", Date.now());
		};
		window.addEventListener("resize", handleResize);
		window.addEventListener("beforeunload", handleUnload);
		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	// Create a queryFn that fetches the outfitFeed from the server
	const fetchOutfitFeed = async () => {
		try {
			// Empty the outfitFeed state
			setOutfitFeed({
				pallet: [],
				outfits: [],
				wasRandom: false,
			});
			// Capture states
			const sizeCapture = size;
			const brandCapture = brand;
			const topGenderCapture = topGender;
			const bottomGenderCapture = bottomGender;
			const shoeGenderCapture = shoeGender;

			// Define target URL
			let url = `${backendTarget}/generateOutfitFeed?size=${JSON.stringify(
				sizeCapture
			)}&brand=${JSON.stringify(
				brandCapture
			)}&topGender=${topGenderCapture}&bottomGender=${bottomGenderCapture}&shoeGender=${shoeGenderCapture}&outfitCount=${20}&palletSize=${60}`;
			// Get the outfitFeed from the server
			console.log("Fetching Feed");
			let res = await axios.get(url, {
				method: "GET",
				withCredentials: true,
			});
			console.log("Feed Fetched");
			// Set the outfitFeed state
			setOutfitFeed(res.data);
			// Reinitialize the feedStatus state
			setFeedStatus({
				feedLength: 20,
				currIndex: 0,
				expanded: false,
			});
			console.log(res.data);

			return 0;
		} catch (err) {
			console.log("Trouble Fetching outfitFeed:", err);
			return err;
		}
	};

	// useQuery to fetch the outfitFeed from the server
	// does NOT automatically refetch when states change, instead uses refetchFeed function
	const {
		isLoading,
		isError,
		refetch: refetchFeed,
	} = useQuery({
		queryKey: [
			"outfitFeed",
			size,
			brand,
			topGender,
			bottomGender,
			shoeGender,
		],
		queryFn: fetchOutfitFeed,
		retry: 3,
		refetchOnWindowFocus: false,
		enabled: false,
	});

	// Fetch the initial feed
	useEffect(() => {
		refetchFeed();
	}, [refetchFeed]);

	// Define function that extends the feed by 20 outfits
	const expandFeed = async () => {
		try {
			// Capture states
			const sizeCapture = size;
			const brandCapture = brand;
			const topGenderCapture = topGender;
			const bottomGenderCapture = bottomGender;
			const shoeGenderCapture = shoeGender;

			let url = `${backendTarget}/generateOutfitFeed?size=${JSON.stringify(
				sizeCapture
			)}&brand=${JSON.stringify(
				brandCapture
			)}&topGender=${topGenderCapture}&bottomGender=${bottomGenderCapture}&shoeGender=${shoeGenderCapture}&outfitCount=${20}&palletSize=${60}`;
			let res = await axios.get(url, {
				method: "GET",
				withCredentials: true,
			});
			const diff = outfitFeed.pallet.length;
			const adjustedOutfits = res.data.outfits.map((outfit) => {
				outfit.top += diff;
				outfit.bottom += diff;
				outfit.shoe += diff;
				return outfit;
			});
			setOutfitFeed((prev) => ({
				pallet: prev.pallet.concat(res.data.pallet),
				outfits: prev.outfits.concat(adjustedOutfits),
			}));
			setFeedStatus((prev) => ({
				feedLength: prev.feedLength + 20,
				currIndex: prev.currIndex,
				expanded: true,
			}));
			return 0;
			// console.log("Feed expanded");
		} catch (err) {
			console.log(err, "Error expanding feed");
			return err;
		}
	};

	// useQuery to expand the feed
	const {
		isLoading: isLoadingExpand,
		isError: isErrorExpand,
		refetch: refetchExpandFeed,
	} = useQuery({
		queryKey: ["outfitFeedExpand"],
		queryFn: expandFeed,
		retry: 3,
		refetchOnWindowFocus: false,
		enabled: false,
	});

	// Crete a mutationFn that makes a post request to the server to rate an outfit
	const rateOutfit = async (args) => {
		try {
			console.log("Rating Outfit...");
			let url = `${backendTarget}/rateOutfit`;
			let res = await axios.post(
				url,
				{
					p1: args[0],
					p2: args[1],
					p3: args[2],
					id1: args[3],
					id2: args[4],
					id3: args[5],
					rating: args[6],
				},
				{ method: "POST", withCredentials: true }
			);
			console.log("Outfit Rated");
			return res.data;
		} catch (err) {
			console.log("Trouble Rating outfit:", err);
			return err;
		}
	};

	// useMutation to rate an outfit
	const rateOutfitMutation = useMutation({
		mutationKey: "RateOutfit",
		mutationFn: rateOutfit,
	});

	// Create a mutationFn that makes a delete request to the server to delete an outfit using its id
	const deleteOutfit = async (args) => {
		try {
			console.log("Deleting Outfit...");
			let url = `${backendTarget}/deleteItem`;
			let res = await axios.post(
				url,
				{
					id: args.id,
					collection: args.collection,
					item: args.item,
				},
				{ method: "POST", withCredentials: true }
			);
			console.log("Outfit Deleted");
			return res.data;
		} catch (err) {
			console.log("Trouble Deleting outfit:", err);
			return err;
		}
	};

	// useMutation to delete an outfit
	const deleteOutfitMutation = useMutation({
		mutationKey: "DeleteOutfit",
		mutationFn: deleteOutfit,
	});

	return initLoad ? (
		<Router>
			<FeedContext.Provider
				value={{
					initLoad,
					outfitFeed,
					setOutfitFeed,
					feedStatus,
					setFeedStatus,
					isLoading,
					isError,
					refetchFeed,
					isLoadingExpand,
					isErrorExpand,
					refetchExpandFeed,
					rateOutfitMutation,
					deleteOutfitMutation,
					images,
					subPage,
					setSubPage,
					setSize,
					setBrand,
					setTopGender,
					setBottomGender,
					setShoeGender,
					topGender,
					bottomGender,
					shoeGender,
					brand,
					size,
					windowWidth,
				}}>
				<div className="App">
					<div className="Navbar-Container">
						<div className="Navbar">
							<Link
								to="/"
								className={
									subPage === "/home"
										? "NavbarElem Selected"
										: "NavbarElem"
								}
								onClick={() => {
									window.scrollTo(0, 0);
									setSubPage("/home");
								}}>
								{" "}
								Home{" "}
							</Link>
							<Link
								to="/wardrobe"
								className={
									subPage === "/wardrobe"
										? "NavbarElem Selected"
										: "NavbarElem"
								}
								onClick={() => {
									window.scrollTo(0, 0);
									setSubPage("/wardrobe");
								}}>
								{" "}
								Wardrobe{" "}
							</Link>
							<Link
								to="/about"
								className={
									subPage === "/about"
										? "NavbarElem Selected"
										: "NavbarElem"
								}
								onClick={() => {
									window.scrollTo(0, 0);
									setSubPage("/about");
								}}>
								{" "}
								About{" "}
							</Link>
						</div>
						<Link
							to="/"
							onClick={() => {
								window.scrollTo(0, 0);
								setSubPage("/home");
							}}>
							<img
								className="NavbarLogo"
								src={logo}
								alt="Logo"
								onClick={() => {}}
								loading="eager"></img>
						</Link>
					</div>
					<Routes>
						<Route path="/" element={<Home />}></Route>
						<Route path="/wardrobe" element={<Generator />}></Route>
						<Route path="/about" element={<About />}></Route>
					</Routes>
				</div>
			</FeedContext.Provider>
		</Router>
	) : (
		<div className="App">
			<div className="Navbar-Container">
				<div className="Navbar">
					<img
						className="NavbarLogo-Loading"
						src={logo}
						alt="Logo"></img>
					<img
						className="Loading-Navbar-Circle"
						src={circle}
						style={{ animationDelay: "0.5s" }}
						alt=""></img>
					<img
						className="Loading-Navbar-Circle"
						src={circle}
						style={{ animationDelay: "0.25s" }}
						alt=""></img>
					<img
						className="Loading-Navbar-Circle"
						src={circle}
						alt=""></img>
				</div>
				<p className="Loading-Header">
					Our Fashionable Gnomes are building the website...
				</p>
				<img
					className="Loading-Spinner"
					src={loadingBuddy}
					alt="Loading Buddy"></img>
			</div>
		</div>
	);
};
