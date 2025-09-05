import * as React from "react";
import {
  LayoutDashboard,
  Library,
  FolderOpen,
  Home,
  Plus,
  Search,
  Tags,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { MindleyLogo } from "@/components/mindley-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "/dashboard",
          icon: Home,
        },
        {
          title: "Quick Add",
          url: "/dashboard/add",
          icon: Plus,
        },
      ],
    },
    {
      title: "Library",
      url: "#",
      icon: Library,
      items: [
        {
          title: "All Resources",
          url: "/library",
          icon: Library,
        },
        {
          title: "Search & Filter",
          url: "/library/search",
          icon: Search,
        },
      ],
    },
    {
      title: "Collections",
      url: "#",
      icon: FolderOpen,
      items: [
        {
          title: "My Collections",
          url: "/collections",
          icon: FolderOpen,
        },
        {
          title: "Tag Manager",
          url: "/collections/tags",
          icon: Tags,
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <MindleyLogo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
