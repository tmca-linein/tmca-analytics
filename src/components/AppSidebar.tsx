'use client'

import { User, Satellite, ChevronDown, BookOpen } from "lucide-react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

const tmcaachildren = [
  {
    title: "Analytics by Space",
    url: "/space",
    icon: Satellite,
  },
  {
    title: "Analytics by User",
    url: "/users",
    icon: User,
  },
  {
    title: "Documentation",
    url: "/docs",
    icon: BookOpen,
  }
];

const tools = [
  {
    title: "Wrike Internal Analytics",
    url: "https://www.wrike.com/",
    icon: <Image src="/wrike-internal.png" alt="" width={18} height={18} />,
    children: tmcaachildren
  },
  {
    title: "Wrike",
    url: "https://www.wrike.com/",
    icon: <Image src="/wrike.png" alt="" width={18} height={18} />,
    children: undefined
  },
  {
    title: "ChatGPT",
    url: "https://www.chatgpt.com/",
    icon: <Image src="/chatgpt.svg" alt="" width={18} height={18} />,
    children: undefined
  },

  {
    title: "Drone Harmony",
    url: "/dh",
    icon: <Image src="/dh.png" alt="" width={18} height={18} />,
    children: undefined
  }
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
          <SidebarGroupLabel className="">Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tools.map((item) =>
                item.children ? (
                  <Collapsible key={item.title} defaultOpen={false} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="w-full">
                          {item.icon}
                          <span>{item.title}</span>
                          <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="pl-6">
                          <SidebarMenu className="mt-1">
                            {item.children.map((child) => (
                              <SidebarMenuItem key={child.title}>
                                <SidebarMenuButton asChild>
                                  <Link href={child.url}>
                                    <child.icon className="h-4 w-4" />
                                    <span>{child.title}</span>
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            ))}
                          </SidebarMenu>
                        </div>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
                        {item.icon}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
