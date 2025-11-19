'use client'

import { User, Satellite, Settings, Share2 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "./ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { useSidebar } from "@/components/ui/sidebar"

const items = [
  {
    title: "Space overview",
    url: "/space",
    icon: Satellite,
  },
  {
    title: "Space users",
    url: "/users",
    icon: User,
  },
  {
    title: "Shared with me",
    url: "/shared-with-me",
    icon: Share2,
  },
];

const AppSidebar = () => {
  const {
    state,
  } = useSidebar()
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-5">
        <SidebarMenu className="justify-between">
            <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/">
                    {state === 'expanded' ? <Image src="/tmca.png" alt="logo" width={140} height={24} /> : <Image src="/tmca_small.png" alt="logo" width={32} height={32} />}
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator/>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.title==="Inbox" && (
                    <SidebarMenuBadge>25</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
