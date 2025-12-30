'use client'

import { User, Satellite, BookOpen } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "./ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { useSidebar } from "@/components/ui/sidebar"

const tools = [
  {
    title: "Wrike",
    url: "https://www.wrike.com/",
    icon: <Image src="/wrike.png" alt="" width={18} height={18} />,
  },
  {
    title: "ChatGPT",
    url: "https://chatgpt.com/",
    icon: <Image src="/chatgpt.svg" alt="" width={18} height={18} />,
  },

  {
    title: "Drone Harmony",
    url: "https://tmca.droneharmony.com/",
    icon: <Image src="/dh.png" alt="" width={18} height={18} />,
  },

  {
    title: "Sympa",
    url: "https://www.sympahr.net/",
    icon: <Image src="/sympa.png" alt="" width={18} height={18} />,
  }
];

const items = [
  {
    title: "Wrike spaces",
    url: "/space",
    icon: Satellite,
  },
  {
    title: "Wrike users",
    url: "/users",
    icon: User,
  },
  // {
  //   title: "Documentation",
  //   url: "/docs",
  //   icon: BookOpen,
  // }
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
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="">Application</SidebarGroupLabel>
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
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tools.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      {item.icon}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
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
