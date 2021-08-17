import { User } from "../models/User.ts";
import { UserType } from "../types.ts";
import { RouterContext } from "https://deno.land/x/oak/mod.ts";
import {
  create,
  getNumericDate,
  verify,
} from "https://deno.land/x/djwt@v2.3/mod.ts";

const key = await crypto.subtle.generateKey(
  { name: "HMAC", hash: "SHA-512" },
  true,
  ["sign", "verify"],
);

export const get_all_users = (ctx: RouterContext) => {
  ctx.response.body = "Got all users";
};

export const register_user = async ({ request, response }: RouterContext) => {
  const user: UserType = await request.body().value;

  try {
    const val = await User.create({ ...user });

    // return session and token
    response.body = await generateToken(val);
  } catch (error) {
    console.log(error);
    response.body = {
      error,
    };

    response.status = 500;
  }
};

export const login_user = async ({ request, response }: RouterContext) => {
  const user: UserType = await request.body().value;

  try {
    // Find username on database
    // Check if user has that password
    const val = await User.where({
      username: user.username,
      password: user.password,
    }).first();

    // if not found, throw error
    if (!val) {
      throw { error: "Auth Error" };
    }

    // return session and token
    response.body = await generateToken(val);
  } catch (error) {
    console.error(error);
    response.body = error;
    response.status = 500;
  }
};

export const validateJWT = async ({ request, response }: RouterContext) => {
  const body = await request.body().value;
  const jwt = body.jwt;

  try {
    await verify(jwt, key)
      .then(() => {
        console.log("valid");
        response.body = "valid JWT";
      })
      .catch((e) => {
        console.log(e);
        response.body = e;
        response.status = 401;
      });
  } catch (error) {
    console.error(error);
    response.body = error;
    response.status = 500;
  }
};

const generateToken = async (user: User) => {
  console.log(key);

  const jwt = await create(
    { alg: "HS512", typ: "JWT" },
    {
      username: user.username,
      exp: getNumericDate(60 * 60),
    },
    key,
  );

  return (jwt);
};
