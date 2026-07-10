import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { S3Uploader } from "../../lib/S3Uploader";
import prisma from "../../lib/prisma";

//  function formatLabel(timezone: string) {
//     return timezone.replace(/_/g, " ");
// }

function formatLabel(timezone: string) {
  const city = timezone.split("/").pop()?.replace(/_/g, " ") ?? timezone;

  return `${city} (${timezone})`;
}

const getTimeZoneList = async () => {
    const result = Intl.supportedValuesOf("timeZone")
      .sort()
      .map((timezone: any) => ({
        label: formatLabel(timezone),
        value: timezone,
      }));

    return result;
};

const getSettings = async () => {
    let settings = await prisma.appSetting.findFirst();

    if (!settings) {
      settings = await prisma.appSetting.create({
        data: {
          timezone: "Europe/Warsaw",
        },
      });
    }

    return settings;
};
interface IUpdateSettings {
  timezone?: string;
}

const updateSettings = async (payload: IUpdateSettings) => {
     let settings = await prisma.appSetting.findFirst();

    if (!settings) {
      settings = await prisma.appSetting.create({
        data: {
          timezone: payload.timezone ?? "Europe/Warsaw",
        },
      });

      return settings;
    }

    return prisma.appSetting.update({
      where: {
        id: settings.id,
      },
      data: payload,
    });
};

export const TimeZoneService = {
  getTimeZoneList,
  getSettings,
  updateSettings
};