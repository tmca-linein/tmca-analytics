'use client'

import { User, Satellite, ChevronDown, BookOpen, ShieldUser } from "lucide-react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { getAdminStatus } from "@/lib/adminState";


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
  },
  {
    title: "Admin panel",
    url: "/admin",
    icon: ShieldUser,
    children: undefined,
    restricted: true
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



const AppSidebar = (props: { isAdmin: boolean }) => {
  const {
    state,
  } = useSidebar();
  const isCollapsed = state !== "expanded";

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
                  isCollapsed ? (
                    <SidebarMenuItem key={item.title}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuButton className="w-full justify-center">
                            {item.icon}
                            <span className="sr-only">{item.title}</span>
                          </SidebarMenuButton>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent side="right" align="start" className="min-w-56">
                          <div className="px-2 py-1 text-sm font-semibold">{item.title}</div>
                          {item.children.map((child) => (
                            <DropdownMenuItem key={child.title} asChild>
                              <Link href={child.url} className="flex items-center gap-2">
                                <child.icon className="h-4 w-4" />
                                <span>{child.title}</span>
                              </Link>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  ) : (
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
                              {item.children.map((child) => {
                                if (child.restricted && props.isAdmin) return null;
                                return (
                                  <SidebarMenuItem key={child.title}>
                                    <SidebarMenuButton asChild>
                                      <Link href={child.url}>
                                        <child.icon className="h-4 w-4" />
                                        <span>{child.title}</span>
                                      </Link>
                                    </SidebarMenuButton>
                                  </SidebarMenuItem>
                                );
                              })}
                            </SidebarMenu>
                          </div>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                ) : (
                  // leaf item unchanged
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className={isCollapsed ? "justify-center" : ""}>
                      <Link href={item.url}>
                        {item.icon}
                        {!isCollapsed && <span>{item.title}</span>}
                        {isCollapsed && <span className="sr-only">{item.title}</span>}
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
