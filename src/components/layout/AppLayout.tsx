import { Outlet } from "react-router-dom";
import Layout from "./Layout";

export default function AppLayout() {
    return (
        <Layout>
            <Outlet />
        </Layout>
    );
}
