import "./styles.css";
import { Providers } from "./providers";

export const metadata = {
	title: "LEASAP",
	description: "Helping Your Studies",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
